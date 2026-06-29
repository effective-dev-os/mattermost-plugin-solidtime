import React from 'react';
import {formatDuration} from 'utils/time';

type Props = {
    seconds: number;
};

const WeekTotalBar: React.FC<Props> = ({seconds}) => (
    <div className='solidtime-week-total'>
        <strong>Week total: {formatDuration(seconds)}</strong>
    </div>
);

export default WeekTotalBar;
