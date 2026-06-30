import {connectSolidtime, getConnectionStatus} from 'api/client';
import {formatPluginError} from 'api/errors';
import {errorMessages} from 'i18n/messages';
import React, {useEffect, useState} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';

type Props = {
    onError: (message: string) => void;
    onConnected: () => void;
};

const ConnectPanel: React.FC<Props> = ({onError, onConnected}) => {
    const intl = useIntl();
    const [serverURL, setServerURL] = useState('');
    const [token, setToken] = useState('');
    const [connecting, setConnecting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const {server_url: url} = await getConnectionStatus();
                if (!cancelled) {
                    setServerURL(url);
                }
            } catch (e) {
                if (!cancelled) {
                    onError(formatPluginError(e, intl));
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [onError, intl]);

    const profileURL = serverURL ? `${serverURL}/user/profile` : '';

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = token.trim();
        if (!trimmed) {
            onError(intl.formatMessage(errorMessages.tokenRequired));
            return;
        }
        setConnecting(true);
        try {
            await connectSolidtime(trimmed);
            setToken('');
            onConnected();
        } catch (err) {
            onError(formatPluginError(err, intl));
        } finally {
            setConnecting(false);
        }
    };

    if (loading) {
        return (
            <div className='solidtime-sidebar solidtime-disconnected solidtime-loading'>
                <FormattedMessage
                    id='solidtime.connect.loading'
                    defaultMessage='Loading…'
                />
            </div>
        );
    }

    return (
        <div className='solidtime-sidebar solidtime-disconnected'>
            <h2 className='solidtime-connect-title'>
                <FormattedMessage
                    id='solidtime.connect.title'
                    defaultMessage='Connect to Solidtime'
                />
            </h2>
            {serverURL ? (
                <ol className='solidtime-connect-steps'>
                    <li>
                        <FormattedMessage
                            id='solidtime.connect.step.profile'
                            defaultMessage='Open your <link>Solidtime profile</link>.'
                            values={{
                                link: (chunks: React.ReactNode) => (
                                    // eslint-disable-next-line @mattermost/use-external-link -- plugin RHS; no ExternalLink in plugin bundle
                                    <a
                                        href={profileURL}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                    >
                                        {chunks}
                                    </a>
                                ),
                            }}
                        />
                    </li>
                    <li>
                        <FormattedMessage
                            id='solidtime.connect.step.generate'
                            defaultMessage='In the <strong>Create API Token</strong> section, generate a new token.'
                            values={{strong: (chunks: React.ReactNode) => <strong>{chunks}</strong>}}
                        />
                    </li>
                    <li>
                        <FormattedMessage
                            id='solidtime.connect.step.paste'
                            defaultMessage='Paste the token below and click Connect.'
                        />
                    </li>
                </ol>
            ) : (
                <p className='solidtime-connect-hint'>
                    <FormattedMessage
                        id='solidtime.connect.admin_hint'
                        defaultMessage='Solidtime Server URL is not configured. Ask your administrator to set it in System Console → Plugins → Solidtime.'
                    />
                </p>
            )}
            <form
                className='solidtime-connect-form'
                onSubmit={handleConnect}
            >
                <label className='solidtime-field'>
                    <span className='solidtime-field-label'>
                        <FormattedMessage
                            id='solidtime.connect.token_label'
                            defaultMessage='API Token'
                        />
                    </span>
                    <input
                        type='password'
                        className='solidtime-field-control'
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder={intl.formatMessage({
                            id: 'solidtime.connect.token_placeholder',
                            defaultMessage: 'Paste your API token',
                        })}
                        disabled={connecting || !serverURL}
                        autoComplete='off'
                        spellCheck={false}
                    />
                </label>
                <button
                    type='submit'
                    className='solidtime-add-btn solidtime-add-btn--primary solidtime-connect-submit'
                    disabled={connecting || !serverURL || !token.trim()}
                >
                    {connecting ? (
                        <FormattedMessage
                            id='solidtime.connect.connecting'
                            defaultMessage='Connecting…'
                        />
                    ) : (
                        <FormattedMessage
                            id='solidtime.connect.submit'
                            defaultMessage='Connect'
                        />
                    )}
                </button>
            </form>
        </div>
    );
};

export default ConnectPanel;
