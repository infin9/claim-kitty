import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export class PinataService {
  static async pinToIPFS(json: Object): Promise<string> {
    var data = JSON.stringify({
      pinataOptions: {
        cidVersion: 1,
      },
      pinataMetadata: {
        name: uuidv4() + '.json',
      },
      pinataContent: data,
    });

    const jsonUploadResponse = await axios({
      method: 'post',
      url: 'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      data: json,
      headers: {
        pinata_api_key: `${process.env.REACT_APP_PINATA_API_KEY}`,
        pinata_secret_api_key: `${process.env.REACT_APP_PINATA_API_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    return jsonUploadResponse.data.IpfsHash;
  }
}
