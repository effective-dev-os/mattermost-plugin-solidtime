import React from 'react';
import {useIntl} from 'react-intl';
import type {WeekRange} from 'utils/dates';
import {formatWeekLabel} from 'utils/dates';

type Props = {
    week: WeekRange;
    onPrev: () => void;
    onNext: () => void;
};

const PaginationFooter: React.FC<Props> = ({week, onPrev, onNext}) => {
    const intl = useIntl();
    return (
        <div className='solidtime-pagination'>
            <button
                type='button'
                className='solidtime-pagination-btn'
                onClick={onPrev}
                aria-label={intl.formatMessage({
                    id: 'solidtime.pagination.prev_week',
                    defaultMessage: 'Previous week',
                })}
            >
                <span
                    className='solidtime-nav-chevron solidtime-nav-chevron--left'
                    aria-hidden='true'
                />
            </button>
            <span className='solidtime-pagination-label'>{formatWeekLabel(week, intl.locale)}</span>
            <button
                type='button'
                className='solidtime-pagination-btn'
                onClick={onNext}
                aria-label={intl.formatMessage({
                    id: 'solidtime.pagination.next_week',
                    defaultMessage: 'Next week',
                })}
            >
                <span
                    className='solidtime-nav-chevron solidtime-nav-chevron--right'
                    aria-hidden='true'
                />
            </button>
        </div>
    );
};

export default PaginationFooter;
