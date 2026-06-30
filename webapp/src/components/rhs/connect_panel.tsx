import {connectSolidtime, getConnectionStatus} from 'api/client';
import {formatPluginError} from 'api/errors';
import React, {useEffect, useState} from 'react';

type Props = {
    onError: (message: string) => void;
    onConnected: () => void;
};

const ConnectPanel: React.FC<Props> = ({onError, onConnected}) => {
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
                    onError(formatPluginError(e));
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
    }, [onError]);

    const profileURL = serverURL ? `${serverURL}/user/profile` : '';

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = token.trim();
        if (!trimmed) {
            onError('API token is required');
            return;
        }
        setConnecting(true);
        try {
            await connectSolidtime(trimmed);
            setToken('');
            onConnected();
        } catch (err) {
            onError(formatPluginError(err));
        } finally {
            setConnecting(false);
        }
    };

    if (loading) {
        return <div className='solidtime-sidebar solidtime-disconnected solidtime-loading'>Loading…</div>;
    }

    return (
        <div className='solidtime-sidebar solidtime-disconnected'>
            <h2 className='solidtime-connect-title'>Connect to Solidtime</h2>
            {serverURL ? (
                <ol className='solidtime-connect-steps'>
                    <li>
                        Open your{' '}
                        <a
                            href={profileURL}
                            target='_blank'
                            rel='noopener noreferrer'
                        >
                            Solidtime profile
                        </a>
                        .
                    </li>
                    <li>
                        In the <strong>Create API Token</strong> section, generate a new token.
                    </li>
                    <li>Paste the token below and click Connect.</li>
                </ol>
            ) : (
                <p className='solidtime-connect-hint'>
                    Solidtime Server URL is not configured. Ask your administrator to set it in
                    {' '}System Console → Plugins → Solidtime.
                </p>
            )}
            <form
                className='solidtime-connect-form'
                onSubmit={handleConnect}
            >
                <label className='solidtime-field'>
                    <span className='solidtime-field-label'>API Token</span>
                    <input
                        type='password'
                        className='solidtime-field-control'
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder='Paste your API token'
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
                    {connecting ? 'Connecting…' : 'Connect'}
                </button>
            </form>
        </div>
    );
};

export default ConnectPanel;
