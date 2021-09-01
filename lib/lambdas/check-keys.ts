import * as AWS from 'aws-sdk';

const template = require('es6-template-strings');

const iam: AWS.IAM = new AWS.IAM();
const ses: AWS.SES = new AWS.SES({
  region: 'eu-west-1'
});

const WARNING_AGE: number = 1000 * 60 * 60 * 24 * 83;
const DELETE_AGE: number = 1000 * 60 * 60 * 24 * 90;

const WARNING_BODY: string = [
  'Hi,',
  '',
  '${user} access key is about to expire. Please rotate it.',
  '',
  'User: ${userName}',
  'Access Key: ${accessKeyId}'
].join('\n');

const DELETE_BODY: string = [
  'Hi,',
  '',
  '${user} access key has expired. Please note it has been deleted.',
  '',
  'User: ${userName}',
  'Access Key: ${accessKeyId}'
].join('\n');

const adminEmails: Array<string> = [
  'ADMIN_EMAIL_ADDRESSES'
];

const sendEmail = async (recipients: Array<string>, subject: string, keyMeta: AWS.IAM.AccessKeyMetadata, severityBody: string) => {
  let body: string = template(severityBody, {
    user: recipients === adminEmails ? `${keyMeta.UserName}\'s` : 'Your',
    userName: keyMeta.UserName,
    accessKeyId: keyMeta.AccessKeyId
  })

  var params: AWS.SES.SendEmailRequest = {
    Destination: {
      ToAddresses: recipients,
    },
    Message: {
      Subject: { Data: subject },
      Body: {
        Text: { Data: body },
      },
    },
    Source: "SOURCE_EMAIL_ADDRESS",
  };

  try {
    await ses.sendEmail(params).promise();
    console.log("Email sent");
  } catch (error) {
    console.log(error);
  }
};

export const handler = async (event: any = {}): Promise<any> => {
  let users: AWS.IAM.ListUsersResponse;
  try {
    users = await iam.listUsers().promise();
  } catch (error) {
    console.log(error)
    return;
  }

  await Promise.all(users.Users.map(async (user: AWS.IAM.User) => {
    let accessKeyParams: AWS.IAM.ListAccessKeysRequest = {
      UserName: user.UserName
    };

    let userAccessKeys: AWS.IAM.ListAccessKeysResponse

    try {
      userAccessKeys = await iam.listAccessKeys(accessKeyParams).promise();
    } catch (error) {
      console.log(error);
      return;
    }

    await Promise.all(userAccessKeys.AccessKeyMetadata.map(async (accessKey: AWS.IAM.AccessKeyMetadata) => {
      if (!accessKey.CreateDate || accessKey.Status !== 'Active' || !accessKey.AccessKeyId) {
        return;
      }

      let severity: string = '';

      if (new Date().getTime() - accessKey.CreateDate.getTime() > DELETE_AGE) {
        try {
          let deleteParams: AWS.IAM.DeleteAccessKeyRequest = {
            UserName: accessKey.UserName,
            AccessKeyId: accessKey.AccessKeyId
          };

          await iam.deleteAccessKey(deleteParams).promise();

          severity = DELETE_BODY;
        } catch (error) {
          console.log(error);
        }
      } else if (new Date().getTime() - accessKey.CreateDate.getTime() > WARNING_AGE) {
        severity = WARNING_BODY;
      }

      if (!severity) {
        return;
      }

      let regexpEmail: RegExp = new RegExp('^[^\\s@]+@[^\\s@]+\.[^\\s@]+$');
      let recipientEmails: Array<string> = adminEmails;

      if (regexpEmail.test(user.UserName)) {
        recipientEmails = [user.UserName];
      }

      await sendEmail(recipientEmails, 'AWS IAM Access Key', accessKey, severity);
    }));
  }));
};