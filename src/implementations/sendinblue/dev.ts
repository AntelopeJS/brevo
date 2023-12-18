import { AddContact, SendTransactionalMail, UpdateContact } from '@ajs.local/sendinblue/dev';
import { addContact, deleteContact, sendTransactionalMail, updateContact } from '../../sendinblue';

export namespace internal {
	export const sendTransactionalMailProxy = (body: SendTransactionalMail) => sendTransactionalMail(body);
	export const addContactProxy = (body: AddContact) => addContact(body);
	export const updateContactProxy = (identifier: string, body: UpdateContact) => updateContact(identifier, body);
	export const deleteContactProxy = (identifier: string) => deleteContact(identifier);
}
