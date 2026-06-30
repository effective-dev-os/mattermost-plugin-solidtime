import {setCurrentOrganization} from 'api/client';
import {handlePluginApiError} from 'api/errors';
import React from 'react';
import {useIntl} from 'react-intl';

import type {Organization} from 'types/solidtime';

type Props = {
    organizations: Organization[];
    currentId: string;
    onChanged: (orgId: string) => void;
    onError: (message: string) => void;
    onConnectionLost: () => void;
};

const OrgSelector: React.FC<Props> = ({organizations, currentId, onChanged, onError, onConnectionLost}) => {
    const intl = useIntl();

    if (organizations.length <= 1) {
        return null;
    }

    const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const orgId = e.target.value;
        if (orgId === currentId) {
            return;
        }
        try {
            await setCurrentOrganization(orgId);
            onChanged(orgId);
        } catch (err) {
            handlePluginApiError(err, onConnectionLost, onError, intl);
        }
    };

    return (
        <div className='solidtime-org-selector'>
            <select
                className='solidtime-org-select'
                value={currentId}
                onChange={handleChange}
                aria-label={intl.formatMessage({
                    id: 'solidtime.org.label',
                    defaultMessage: 'Solidtime organization',
                })}
            >
                {organizations.map((org) => (
                    <option
                        key={org.org_id}
                        value={org.org_id}
                    >
                        {org.org_name}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default OrgSelector;
