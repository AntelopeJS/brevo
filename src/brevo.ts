import {
	APIResponse,
	AddContact,
	SendTransactionalMail,
	UpdateContact,
	AddContactList,
	Contact,
} from '@ajs.local/brevo/dev';
import axios from 'axios';

interface BrevoConfig {
	apiKey: string;
}

let config: BrevoConfig;
export function setConfig(newConfig: BrevoConfig) {
	config = newConfig;
}

export async function sendTransactionalMail(body: SendTransactionalMail): Promise<APIResponse> {
	const response = await axios.post('https://api.brevo.com/v3/smtp/email', body, {
		headers: {
			accept: 'application/json',
			'content-type': 'application/json',
			'api-key': config.apiKey,
		},
		validateStatus: () => true,
	});
	return { status: response.status, data: response.data };
}

export async function contactDetails(identifier: string): Promise<APIResponse<Contact>> {
	const encodedIdentifier = encodeURIComponent(identifier);

	const response = await axios.get(`https://api.brevo.com/v3/contacts/${encodedIdentifier}`, {
		headers: {
			accept: 'application/json',
			'content-type': 'application/json',
			'api-key': config.apiKey,
		},
		validateStatus: () => true,
	});
	return { status: response.status, data: response.data };
}

export async function addContact(body: AddContact): Promise<APIResponse> {
	const response = await axios.post('https://api.brevo.com/v3/contacts', body, {
		headers: {
			accept: 'application/json',
			'content-type': 'application/json',
			'api-key': config.apiKey,
		},
		validateStatus: () => true,
	});
	return { status: response.status, data: response.data };
}

export async function updateContact(identifier: string, body: UpdateContact): Promise<APIResponse> {
	const encodedIdentifier = encodeURIComponent(identifier);

	const response = await axios.put(`https://api.brevo.com/v3/contacts/${encodedIdentifier}`, body, {
		headers: {
			accept: 'application/json',
			'content-type': 'application/json',
			'api-key': config.apiKey,
		},
		validateStatus: () => true,
	});
	return { status: response.status, data: response.data };
}

export async function deleteContact(identifier: string): Promise<APIResponse> {
	const encodedIdentifier = encodeURIComponent(identifier);

	const response = await axios.delete(`https://api.brevo.com/v3/contacts/${encodedIdentifier}`, {
		headers: {
			accept: 'application/json',
			'content-type': 'application/json',
			'api-key': config.apiKey,
		},
		validateStatus: () => true,
	});
	return { status: response.status, data: response.data };
}

export async function addContactList(body: AddContactList): Promise<APIResponse> {
	const response = await axios.post(`https://api.brevo.com/v3/contacts/lists`, body, {
		headers: {
			accept: 'application/json',
			'content-type': 'application/json',
			'api-key': config.apiKey,
		},
		validateStatus: () => true,
	});
	return { status: response.status, data: response.data };
}

export async function deleteContactList(listId: number): Promise<APIResponse> {
	const response = await axios.delete(`https://api.brevo.com/v3/contacts/lists/${listId}`, {
		headers: {
			accept: 'application/json',
			'content-type': 'application/json',
			'api-key': config.apiKey,
		},
		validateStatus: () => true,
	});
	return { status: response.status, data: response.data };
}
