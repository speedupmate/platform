import template from './sw-product-category-form.html.twig';
import './sw-product-category-form.scss';

const { Component } = Shopware;
const { EntityCollection, Criteria } = Shopware.Data;
const { mapPropertyErrors, mapState, mapGetters } = Shopware.Component.getComponentHelper();

Component.register('sw-product-category-form', {
    template,

    inject: ['repositoryFactory', 'feature'],

    props: {
        allowEdit: {
            type: Boolean,
            required: false,
            default: true
        }
    },

    data() {
        return {
            displayVisibilityDetail: false,
            multiSelectVisible: true,
            salesChannel: null
        };
    },

    computed: {
        ...mapState('swProductDetail', [
            'product',
            'parentProduct',
            'localMode',
            'loading',
            'modeSettingsVisible'
        ]),

        ...mapGetters('swProductDetail', [
            'isChild'
        ]),

        ...mapPropertyErrors('product', [
            'tags',
            'active'
        ]),

        hasSelectedVisibilities() {
            if (this.product && this.product.visibilities) {
                return this.product.visibilities.length > 0;
            }
            return false;
        }
    },

    created() {
        this.createdComponent();
    },

    methods: {
        createdComponent() {
            this.salesChannel = new EntityCollection(
                '/sales-channel',
                'sales_channel',
                Shopware.Context.api,
                new Criteria()
            );
        },

        displayAdvancedVisibility() {
            this.displayVisibilityDetail = true;
        },

        closeAdvancedVisibility() {
            this.displayVisibilityDetail = false;
        }
    }
});
