<?php declare(strict_types=1);

namespace Shopware\Core\Content\Product\SalesChannel\Search;

use OpenApi\Annotations as OA;
use Psr\Log\LoggerInterface;
use Shopware\Core\Content\Product\Events\ProductSearchRouteCacheKeyEvent;
use Shopware\Core\Content\Product\Events\ProductSearchRouteCacheTagsEvent;
use Shopware\Core\Framework\Adapter\Cache\AbstractCacheTracer;
use Shopware\Core\Framework\Adapter\Cache\CacheCompressor;
use Shopware\Core\Framework\DataAbstractionLayer\Cache\EntityCacheKeyGenerator;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\Feature;
use Shopware\Core\Framework\Routing\Annotation\Since;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Core\System\SalesChannel\StoreApiResponse;
use Symfony\Component\Cache\Adapter\TagAwareAdapterInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;

class CachedProductSearchRoute extends AbstractProductSearchRoute
{
    private const NAME = 'product-search-route';

    private AbstractProductSearchRoute $decorated;

    private TagAwareAdapterInterface $cache;

    private EntityCacheKeyGenerator $generator;

    private AbstractCacheTracer $tracer;

    private array $states;

    private EventDispatcherInterface $dispatcher;

    private LoggerInterface $logger;

    public function __construct(
        AbstractProductSearchRoute $decorated,
        TagAwareAdapterInterface $cache,
        EntityCacheKeyGenerator $generator,
        AbstractCacheTracer $tracer,
        EventDispatcherInterface $dispatcher,
        array $states,
        LoggerInterface $logger
    ) {
        $this->decorated = $decorated;
        $this->cache = $cache;
        $this->generator = $generator;
        $this->tracer = $tracer;
        $this->states = $states;
        $this->dispatcher = $dispatcher;
        $this->logger = $logger;
    }

    public function getDecorated(): AbstractProductSearchRoute
    {
        return $this->decorated;
    }

    /**
     * @Since("6.2.0.0")
     * @OA\Get(
     *      path="/search",
     *      summary="Search",
     *      operationId="searchPage",
     *      tags={"Store API","Search"},
     *      @OA\Parameter(
     *          name="search",
     *          description="Search term",
     *          in="query",
     *          @OA\Schema(type="string")
     *      ),
     *      @OA\Response(
     *          response="200",
     *          description="Found products",
     *          @OA\JsonContent(ref="#/components/schemas/ProductListingResult")
     *     )
     * )
     * @Route("/store-api/search", name="store-api.search", methods={"POST"})
     */
    public function load(Request $request, SalesChannelContext $context, Criteria $criteria): ProductSearchRouteResponse
    {
        if (!Feature::isActive('FEATURE_NEXT_10514')) {
            return $this->getDecorated()->load($request, $context, $criteria);
        }

        if ($context->hasState(...$this->states)) {
            $this->logger->info('cache-miss: ' . self::NAME);

            return $this->getDecorated()->load($request, $context, $criteria);
        }

        $item = $this->cache->getItem(
            $this->generateKey($request, $context, $criteria)
        );

        try {
            if ($item->isHit() && $item->get()) {
                $this->logger->info('cache-hit: ' . self::NAME);

                return CacheCompressor::uncompress($item);
            }
        } catch (\Throwable $e) {
            $this->logger->error($e->getMessage());
        }

        $this->logger->info('cache-miss: ' . self::NAME);

        $response = $this->tracer->trace(self::NAME, function () use ($request, $context, $criteria) {
            return $this->getDecorated()->load($request, $context, $criteria);
        });

        $item = CacheCompressor::compress($item, $response);

        $item->tag($this->generateTags($request, $response, $context, $criteria));

        $this->cache->save($item);

        return $response;
    }

    private function generateKey(Request $request, SalesChannelContext $context, Criteria $criteria): string
    {
        $parts = [
            self::NAME,
            $this->generator->getCriteriaHash($criteria),
            $this->generator->getSalesChannelContextHash($context),
            $request->get('search'),
        ];

        $event = new ProductSearchRouteCacheKeyEvent($parts, $request, $context, $criteria);
        $this->dispatcher->dispatch($event);

        return md5(implode('-', $event->getParts()));
    }

    private function generateTags(Request $request, StoreApiResponse $response, SalesChannelContext $context, Criteria $criteria): array
    {
        $tags = array_merge(
            $this->tracer->get(self::NAME),
            [self::NAME]
        );

        $event = new ProductSearchRouteCacheTagsEvent($tags, $request, $response, $context, $criteria);
        $this->dispatcher->dispatch($event);

        return $event->getTags();
    }
}
