import template from './sw-date-filter.html.twig';
import './sw-date-filter.scss';

const { Component } = Shopware;

/**
 * @private
 */
Component.register('sw-date-filter', {
    template,

    props: {
        filter: {
            type: Object,
            required: true
        },

        active: {
            type: Boolean,
            required: true
        }
    },

    data() {
        return {
            dateValue: {
                from: null,
                to: null
            }
        };
    },

    computed: {
        dateType() {
            if (['time', 'date', 'datetime', 'datetime-local'].includes(this.filter.dateType)) {
                return this.filter.dateType;
            }

            return 'date';
        },

        isDateTimeType() {
            return this.dateType === 'datetime' || this.dateType === 'datetime-local';
        }
    },

    methods: {
        updateFilter(params) {
            if (!this.dateValue.from && !this.dateValue.to) {
                this.$emit('filter-reset', this.filter.name);
                return;
            }

            this.$emit('filter-update', this.filter.name, params);
        },

        resetFilter() {
            this.dateValue = { from: null, to: null };
            this.$emit('filter-reset', this.filter.name);
        }
    }
});
