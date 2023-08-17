import { APIResponse, SendTransactionalMail } from '@ajs.local/sendinblue/dev';
import axios from 'axios';

interface SendinblueConfig {
	apiKey: string;
}

let config: SendinblueConfig;
export function setConfig(newConfig: SendinblueConfig) {
	config = newConfig;
}

export async function sendTransactionalMail(body: SendTransactionalMail): Promise<APIResponse> {
	const response = await axios.post('https://api.sendinblue.com/v3/smtp/email', body, {
		headers: {
			accept: 'application/json',
			'content-type': 'application/json',
			'api-key': config.apiKey,
		},
		validateStatus: () => true,
	});
	return { status: response.status, data: response.data };
}
