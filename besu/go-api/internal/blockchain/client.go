package blockchain

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"math/big"
	"strings"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
)

const SimpleStorageABI = `[
	{
		"inputs": [{"internalType": "uint256", "name": "_value", "type": "uint256"}],
		"name": "set",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "get",
		"outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "storedData",
		"outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
		"stateMutability": "view",
		"type": "function"
	}
]`

type Client struct {
	client      *ethclient.Client
	privateKey  *ecdsa.PrivateKey
	fromAddress common.Address
	contractABI abi.ABI
}

func NewClient(rpcURL, privateKeyHex string) (*Client, error) {
	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Ethereum client: %w", err)
	}

	privateKey, err := crypto.HexToECDSA(privateKeyHex)
	if err != nil {
		return nil, fmt.Errorf("failed to parse private key: %w", err)
	}

	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		return nil, fmt.Errorf("error casting public key to ECDSA")
	}
	fromAddress := crypto.PubkeyToAddress(*publicKeyECDSA)

	contractABI, err := abi.JSON(strings.NewReader(SimpleStorageABI))
	if err != nil {
		return nil, fmt.Errorf("failed to parse contract ABI: %w", err)
	}

	return &Client{
		client:      client,
		privateKey:  privateKey,
		fromAddress: fromAddress,
		contractABI: contractABI,
	}, nil
}

func (c *Client) GetStoredValue(contractAddress string) (*big.Int, error) {
	if contractAddress == "" {
		return nil, fmt.Errorf("contract address not set")
	}

	address := common.HexToAddress(contractAddress)

	data, err := c.contractABI.Pack("get")
	if err != nil {
		return nil, fmt.Errorf("failed to pack get method: %w", err)
	}

	result, err := c.client.CallContract(context.Background(), ethereum.CallMsg{
		To:   &address,
		Data: data,
	}, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to call contract: %w", err)
	}

	var value *big.Int
	err = c.contractABI.UnpackIntoInterface(&value, "get", result)
	if err != nil {
		return nil, fmt.Errorf("failed to unpack result: %w", err)
	}

	return value, nil
}

func (c *Client) SetStoredValue(contractAddress string, value *big.Int) (*types.Transaction, error) {
	if contractAddress == "" {
		return nil, fmt.Errorf("contract address not set")
	}

	address := common.HexToAddress(contractAddress)

	nonce, err := c.client.PendingNonceAt(context.Background(), c.fromAddress)
	if err != nil {
		return nil, fmt.Errorf("failed to get nonce: %w", err)
	}

	gasPrice, err := c.client.SuggestGasPrice(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to get gas price: %w", err)
	}

	data, err := c.contractABI.Pack("set", value)
	if err != nil {
		return nil, fmt.Errorf("failed to pack set method: %w", err)
	}

	gasLimit, err := c.client.EstimateGas(context.Background(), ethereum.CallMsg{
		From: c.fromAddress,
		To:   &address,
		Data: data,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to estimate gas: %w", err)
	}

	tx := types.NewTransaction(nonce, address, big.NewInt(0), gasLimit, gasPrice, data)

	chainID, err := c.client.NetworkID(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to get chain ID: %w", err)
	}

	signedTx, err := types.SignTx(tx, types.NewEIP155Signer(chainID), c.privateKey)
	if err != nil {
		return nil, fmt.Errorf("failed to sign transaction: %w", err)
	}

	err = c.client.SendTransaction(context.Background(), signedTx)
	if err != nil {
		return nil, fmt.Errorf("failed to send transaction: %w", err)
	}

	return signedTx, nil
}

func (c *Client) WaitForTransactionReceipt(txHash common.Hash) (*types.Receipt, error) {
	receipt, err := c.client.TransactionReceipt(context.Background(), txHash)
	if err != nil {
		return nil, fmt.Errorf("failed to get transaction receipt: %w", err)
	}

	return receipt, nil
}

func (c *Client) GetNetworkInfo() (map[string]interface{}, error) {
	chainID, err := c.client.NetworkID(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to get chain ID: %w", err)
	}

	blockNumber, err := c.client.BlockNumber(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to get block number: %w", err)
	}

	balance, err := c.client.BalanceAt(context.Background(), c.fromAddress, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to get balance: %w", err)
	}

	return map[string]interface{}{
		"chain_id":     chainID.String(),
		"block_number": blockNumber,
		"account":      c.fromAddress.Hex(),
		"balance":      balance.String(),
	}, nil
}

func (c *Client) Close() {
	c.client.Close()
}
