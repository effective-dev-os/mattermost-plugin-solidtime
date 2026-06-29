import React from 'react';
import type {WeekRange} from 'utils/dates';
import {formatWeekLabel} from 'utils/dates';

type Props = {
    week: WeekRange;
    onPrev: () => void;
    onNext: () => void;
};

const PaginationFooter: React.FC<Props> = ({week, onPrev, onNext}) => (
    <div className='solidtime-pagination'>
        <button
            type='button'
            className='solidtime-pagination-btn'
            onClick={onPrev}
            aria-label='Previous week'
        >
            ◄
        </button>
        <span className='solidtime-pagination-label'>{formatWeekLabel(week)}</span>
        <button
            type='button'
            className='solidtime-pagination-btn'
            onClick={onNext}
            aria-label='Next week'
        >
            ►
        </button>
    </div>
);

export default PaginationFooter;
