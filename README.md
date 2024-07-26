
# Herodotus Task

### Project Overview


This project aims to understand and utilize the architecture of Optimism’s Dispute Games within an Optimistic Rollup (ORU) framework. The focus is on developing tools to scrape data related to outputs proposed by a specific proposer, identify associated challenges, and provide this data through a REST API. Additionally, the project involves implementing functionality to find sequencers who have never been disputed and sign responses using ECDSA

### Task Description 

The task involves working with external documentation to develop a tooling system that:

- Scrapes all outputs proposed by a specific proposer on the Optimism Layer 2 (L2) solution, which settles back to Ethereum Layer 1 (L1).
- Identifies any associated challenges to the proposed outputs within a seven-day window.
- Finds the transaction hash for each challenge and proposal.
- Saves the data in a MongoDB database for querying purposes.
- Exposes a REST API to find sequencers who have never been disputed.
- Signs the API responses using ECDSA.

### Project Structure

```
node_modules/
.env
.env.example
.gitignore
src/
  ├── controllers/
  │   └── sequencerController.js
  ├── models/
  │   └── mongoClient.js
  ├── routes/
  │   └── sequencerRoutes.js
  ├── services/
  │   ├── scrapeService.js
  │   └── sequencerService.js
  ├── utils/
  │   ├── generatePrivateKey.js
  │   └── signMessage.js
  ├── index.js
  └── server.js
package-lock.json
package.json
```

### File Descriptions

- `src/index.js`: Entry point of the application. Starts the Express server.
- `src/server.js`: Sets up the Express server, connects to MongoDB, and uses the routes.
- `src/controllers/sequencerController.js`: Handles the logic for API routes related to sequencers.
- `src/models/mongoClient.js`: Handles MongoDB connection and provides functions to interact with the database.
- `src/routes/sequencerRoutes.js`: Defines the routes for sequencer operations.
- `src/services/scrapeService.js`: Contains logic for scraping and analyzing transactions from Etherscan.
- `src/services/sequencerService.js`: Contains business logic for querying the database.
- `src/utils/generatePrivateKey.js`: Generates a new private key for ECDSA.
- `src/utils/signMessage.js`: Utility function to sign messages using ECDSA.

### Setup 
#### Prerequisites
- Node.js
- MongoDB

#### Installation
- Clone the repository:
```
git clone https://github.com/kleczynski/herodotusTask.git
cd herodotusTask
```
- Install dependencies 
```
npm install
```
- Create a `.env` file based on the `.env.example` and fill in the necessary values:

```
MONGO_URI=your-mongo-uri
DATABASE_NAME=ethTransactions
COLLECTION_NAME=transactions
PRIVATE_KEY=your-private-key
PROPOSER_ADDRESS=your-proposer-address
API_KEY=your-api-key
RATE_LIMIT_DELAY=200
PORT=3000
INFURA_PROJECT_ID='infura-project-id'
```

### Running the Scraper 
```
node src/services/scrapeService.js
```
### Starting the Server
```
node src/index.js
```
### Accessing the API
```
http://localhost:3000/sequencer
```

### Resources
[Optimism Fault Proofs Explainer](https://docs.optimism.io/stack/protocol/fault-proofs/explainer)

[Contract Addresses](https://docs.optimism.io/chain/addresses#sepolia-l1)

[Sepolia Etherscan Address](https://sepolia.etherscan.io/address/0x05f9613adb30026ffd634f38e5c4dfd30a197fa1)

[Etherscan API Documentation](https://docs.etherscan.io/)

[Fault Dispute Game](https://specs.optimism.io/fault-proof/stage-one/fault-dispute-game.html)
