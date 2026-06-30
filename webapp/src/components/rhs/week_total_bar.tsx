import React from 'react';
import {useIntl} from 'react-intl';
import {formatDuration} from 'utils/time';

type Props = {
    seconds: number;
};

const WeekTotalBar: React.FC<Props> = ({seconds}) => {
    const intl = useIntl();
    return (
        <div className='solidtime-week-total'>
            <strong>
                {intl.formatMessage(
                    {
                        id: 'solidtime.week.total',
                        defaultMessage: 'Week total: {duration}',
                    },
                    {duration: formatDuration(seconds)},
                )}
            </strong>
        </div>
    );
};

export default WeekTotalBar;
