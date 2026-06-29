package kvstore

import (
	"github.com/mattermost/mattermost/server/public/pluginapi"
	"github.com/pkg/errors"
)

const (
	tokenKeyPrefix  = "solidtime_token_"
	orgKeyPrefix    = "solidtime_org_"
	memberKeyPrefix = "solidtime_member_"
)

type Client struct {
	client *pluginapi.Client
}

func NewKVStore(client *pluginapi.Client) KVStore {
	return Client{client: client}
}

func (kv Client) SetToken(userID, token string) error {
	_, err := kv.client.KV.Set(tokenKeyPrefix+userID, token)
	if err != nil {
		return errors.Wrap(err, "failed to set token")
	}
	return nil
}

func (kv Client) GetToken(userID string) (string, bool, error) {
	var token string
	err := kv.client.KV.Get(tokenKeyPrefix+userID, &token)
	if err != nil {
		return "", false, errors.Wrap(err, "failed to get token")
	}
	if token == "" {
		return "", false, nil
	}
	return token, true, nil
}

func (kv Client) SetOrgID(userID, orgID string) error {
	_, err := kv.client.KV.Set(orgKeyPrefix+userID, orgID)
	if err != nil {
		return errors.Wrap(err, "failed to set org id")
	}
	return nil
}

func (kv Client) GetOrgID(userID string) (string, bool, error) {
	var orgID string
	err := kv.client.KV.Get(orgKeyPrefix+userID, &orgID)
	if err != nil {
		return "", false, errors.Wrap(err, "failed to get org id")
	}
	if orgID == "" {
		return "", false, nil
	}
	return orgID, true, nil
}

func (kv Client) SetMemberID(userID, memberID string) error {
	_, err := kv.client.KV.Set(memberKeyPrefix+userID, memberID)
	if err != nil {
		return errors.Wrap(err, "failed to set member id")
	}
	return nil
}

func (kv Client) GetMemberID(userID string) (string, bool, error) {
	var memberID string
	err := kv.client.KV.Get(memberKeyPrefix+userID, &memberID)
	if err != nil {
		return "", false, errors.Wrap(err, "failed to get member id")
	}
	if memberID == "" {
		return "", false, nil
	}
	return memberID, true, nil
}

func (kv Client) DeleteUserData(userID string) error {
	for _, key := range []string{tokenKeyPrefix + userID, orgKeyPrefix + userID, memberKeyPrefix + userID} {
		if err := kv.client.KV.Delete(key); err != nil {
			return errors.Wrap(err, "failed to delete kv key")
		}
	}
	return nil
}

func (kv Client) IsConnected(userID string) (bool, error) {
	_, ok, err := kv.GetToken(userID)
	return ok, err
}
