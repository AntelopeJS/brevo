import { SendTransactionalMail } from '@ajs.local/sendinblue/dev';
import { sendTransactionalMail } from '../../sendinblue';

export namespace internal {
	export const sendTransactionalMailProxy = (body: SendTransactionalMail) => sendTransactionalMail(body);
}
