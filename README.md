# Love Token dApp
This project is the final assignment for the **Introduction to Cryptocurrency** course (Spring 2024). It involves creating a custom ERC-20 token called LoveToken, which integrates off-chain data via Chainlink's Oracle and includes a custom frontend to connect users to the contracts.

## Deployments

| Network          | Address                                                                           |
| ---------------- | --------------------------------------------------------------------------------- |
| Sepolia          | [0xD19537f784e1E14b740468c698bFDB9e4d9FEF85](https://sepolia.etherscan.io/address/0xD19537f784e1E14b740468c698bFDB9e4d9FEF85)|

[Love Token dApp](https://mfrashidi.github.io/love-token)

## Build the project
### Clone the repository
```bash
git clone https://github.com/mfrashidi/love-token.git && cd love-token
```
### Setup the Weather API
Either you can use an external API to get the weather's data or you provide it yourself. I have written a pretty simple js file to tell if in a specific coordiante is raining right now or not. You can start the app with this command:
```bash
node backend/weather_api.js
```
### Running a Chainlink node
In order to gather weather data from outside of the blockchain, you have to run a chainlink node. You can use the [official toturial](https://docs.chain.link/chainlink-nodes/v1/running-a-chainlink-node). You can use this code for the node's job.
```
type = "directrequest"
schemaVersion = 1
name = "Weather API job"
externalJobID = "b1d42cd5-4a3a-4200-b1f7-25a68e48aad8"
forwardingAllowed = false
maxTaskDuration = "0s"
contractAddress = "[CONTRACT_ADDRESS]"
evmChainID = "11155111"
minIncomingConfirmations = 0
minContractPaymentLinkJuels = "0"
observationSource = """
    decode_log   [type="ethabidecodelog"
                  abi="OracleRequest(bytes32 indexed specId, address requester, bytes32 requestId, uint256 payment, address callbackAddr, bytes4 callbackFunctionId, uint256 cancelExpiration, uint256 dataVersion, bytes data)"
                  data="$(jobRun.logData)"
                  topics="$(jobRun.logTopics)"]

    decode_cbor  [type="cborparse" data="$(decode_log.data)"]
    fetch        [type="http" method=GET url="$(decode_cbor.get)" allowUnrestrictedNetworkAccess="true"]
    parse        [type="jsonparse" path="$(decode_cbor.path)" data="$(fetch)"]

    encode_data  [type="ethabiencode" abi="(bytes32 requestId, bool value)" data="{ \\"requestId\\": $(decode_log.requestId), \\"value\\": $(parse) }"]
    encode_tx    [type="ethabiencode"
                  abi="fulfillOracleRequest2(bytes32 requestId, uint256 payment, address callbackAddress, bytes4 callbackFunctionId, uint256 expiration, bytes calldata data)"
                  data="{\\"requestId\\": $(decode_log.requestId), \\"payment\\":   $(decode_log.payment), \\"callbackAddress\\": $(decode_log.callbackAddr), \\"callbackFunctionId\\": $(decode_log.callbackFunctionId), \\"expiration\\": $(decode_log.cancelExpiration), \\"data\\": $(encode_data)}"
                  ]
    submit_tx    [type="ethtx" to="[CONTRACT_ADDRESS]" data="$(encode_tx)"]

    decode_log -> decode_cbor -> fetch -> parse -> encode_data -> encode_tx -> submit_tx
"""
```

### Contracts Deployment
1. Install the dependencies
```bash
npm install
```
2. Fill the environment variables
```bash
cp .env.example .env
```
Get the `ETHERSCAN_API_KEY` from [Etherscan](https://etherscan.io), the `SEPOLIA_URL` from [Alchemy](https://alchemy.com) and the `PRIVATE_KEY` from metamask (or any other wallets)

3. Deploy the contracts
```bash
npx hardhat deploy --network sepolia --hour 23 --minute 23 --job "[JOB_ID]" --oracle "[CONTRACT_ADDRESS]"
```
**(Optional)** You can verify the contract while you deploy it. You just need to add `--verify true` to the deploy command.
### dApp Deployment
The frontend will automatically deploy via a GitHub action. It copies the frontend directory to the project's GitHub Pages. Ensure GitHub Pages is enabled in your repository settings. Remember to update the `contractAddress` variable in `frontend/scripts/smart_contract.js` accordingly.
