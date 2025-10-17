import {
  AddContact,
  AddContactList,
  SendTransactionalMail,
  SendTransactionalSMS,
  UpdateContact,
} from '@ajs.local/brevo/dev';
import {
  addContact,
  addContactList,
  contactDetails,
  deleteContact,
  deleteContactList,
  sendTransactionalMail,
  sendTransactionalSMS,
  updateContact,
} from '../../brevo';

export namespace internal {
  export const sendTransactionalMailProxy = (body: SendTransactionalMail) => sendTransactionalMail(body);
  export const sendTransactionalSMSProxy = (body: SendTransactionalSMS) => sendTransactionalSMS(body);
  export const contactDetailsProxy = (identifier: string) => contactDetails(identifier);
  export const addContactProxy = (body: AddContact) => addContact(body);
  export const updateContactProxy = (identifier: string, body: UpdateContact) => updateContact(identifier, body);
  export const deleteContactProxy = (identifier: string) => deleteContact(identifier);
  export const addContactListProxy = (body: AddContactList) => addContactList(body);
  export const deleteContactListProxy = (identifier: number) => deleteContactList(identifier);
}
