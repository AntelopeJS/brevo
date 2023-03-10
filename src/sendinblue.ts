import { APIResponse, SendTransactionalMail } from '@ajs.local/sendinblue/dev';
import axios from 'axios';

interface SendinblueConfig {
	apiKey: string;
}

export class SendinblueHandler {
	private apiKey: any;

	constructor(config: SendinblueConfig) {
		if (!config.apiKey) {
			throw new Error('Invalid SendInBlue config');
		}
		this.apiKey = config.apiKey;
	}

	async sendTransactionalMail(body: SendTransactionalMail): Promise<APIResponse> {
		const response = await axios.post('https://api.sendinblue.com/v3/smtp/email', body, {
			headers: {
				accept: 'application/json',
				'content-type': 'application/json',
				'api-key': this.apiKey,
			},
			validateStatus: () => true,
		});
		return { status: response.status, data: response.data };
	}
}
