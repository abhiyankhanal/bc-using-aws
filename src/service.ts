import axios from 'axios';
import { Sha256 } from '@aws-crypto/sha256-js';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { SignatureV4 } from '@aws-sdk/signature-v4';

const signer = new SignatureV4({
    credentials: defaultProvider(),
    service: 'managedblockchain',
    region: 'eu-west-2',
    sha256: Sha256,
  });

  export const getTransactionByIds = async (transactionIds: string[]) => {
    const rpc = {
      jsonrpc: "1.0",
      id: "1001",
      method: 'getblock',
      params: transactionIds
    };

    const bitcoinURL = 'https://testnet.bitcoin.managedblockchain.eu-west-2.amazonaws.com/';
    const url = new URL(bitcoinURL);

    const req = new HttpRequest({
      hostname: url.hostname.toString(),
      path: url.pathname.toString(),
      body: JSON.stringify(rpc),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip',
        host: url.hostname,
      }
    });

    const signedRequest = await signer.sign(req, { signingDate: new Date() });

    try {
      const response = await axios({
        ...signedRequest,
        url: bitcoinURL,
        data: req.body,
        headers: {
          ...signedRequest.headers,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer'
      });

      const decodedResponse = Buffer.from(response.data, 'binary').toString('utf-8');
      const parsedData = JSON.parse(decodedResponse);

      return parsedData;
    } catch (error) {
      console.error('Something went wrong: ', error);
      throw error;
    }
  };





const bitcoinTestnetAddress = 'n2dhY1zA7NVJuhnaCZjr3iX44nUmVYm6Jn';

// Function to get UTXOs for a Bitcoin testnet address
export const getUTXOs = async (address: string) => {
  try {
    const response = await axios.get(`https://blockstream.info/testnet/api/address/${address}/utxo`);
    return response.data;
  } catch (error) {
    console.error('Error fetching UTXOs:', error);
    throw error;
  }
};

// Function to create and broadcast the transaction
export const createTransaction = async () => {
  // Step 1: Fetch UTXOs
  const utxos = await getUTXOs(bitcoinTestnetAddress);
  console.log('UTXOs:', utxos);

  // Step 2: Prepare the transaction
  // Create the raw transaction based on UTXOs, inputs, and outputs
  const transaction = {
    inputs: utxos.map(utxo => ({
      txid: utxo.txid,
      vout: utxo.vout,
      value: utxo.value,
    })),
    outputs: [
      {
        // Recipient address
        address: 'tb1qlj64u6fqutr0xue85kl55fx0gt4m4urun25p7q',
        amount: 0.0000001, // Replace with desired amount (in BTC)
      },
      {
        // Change address (usually same as sender)
        address: bitcoinTestnetAddress,
        amount: utxos.reduce((acc, utxo) => acc + utxo.value, 0) - 0.00001, // Subtract fee
      },
    ],
  };

  // Step 3: Sign the transaction using AWS SignatureV4
  const signer = new SignatureV4({
    credentials: defaultProvider(),
    service: 'managedblockchain',
    region: 'eu-west-2',
    sha256: Sha256,
  });

  const rpc = {
    jsonrpc: '1.0',
    id: '1002',
    method: 'createrawtransaction',
    params: [transaction],
  };

  const bitcoinURL = 'https://testnet.bitcoin.managedblockchain.eu-west-2.amazonaws.com/';
  const url = new URL(bitcoinURL);

  const req = new HttpRequest({
    hostname: url.hostname.toString(),
    path: url.pathname.toString(),
    body: JSON.stringify(rpc),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Encoding': 'gzip',
      host: url.hostname,
    },
  });

  const signedRequest = await signer.sign(req, { signingDate: new Date() });
  

  // Step 4: Broadcast the transaction
  try {
    const response = await axios({
      ...signedRequest,
      url: bitcoinURL,
      data: req.body,
      headers: {
        ...signedRequest.headers,
        'Content-Type': 'application/json',
      },
      responseType: 'arraybuffer',
    });

    const decodedResponse = Buffer.from(response.data, 'binary').toString('utf-8');
    const parsedData = JSON.parse(decodedResponse);

    console.log('Transaction broadcasted successfully:', parsedData);
    return parsedData;
  } catch (error) {
    console.error('Error broadcasting transaction:', error);
    throw error;
  }
};