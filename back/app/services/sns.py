import boto3
import os
import logging
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

def subscribe_user_to_sns(email: str):
    """
    Subscribes a user's email to the AWS SNS topic.
    """
    topic_arn = os.getenv("AWS_SNS_TOPIC_ARN")
    region = os.getenv("AWS_REGION", "us-east-1")
    access_key = os.getenv("AWS_ACCESS_KEY_ID")
    secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
    # session_token = os.getenv("AWS_SESSION_TOKEN") | For My testing. yall can leave this part alone

    if not all([topic_arn, access_key, secret_key]):
        logger.warning("AWS SNS configuration is missing. Skipping subscription.")
        return None

    try:
        sns_client = boto3.client(
            "sns",
            region_name=region,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            # aws_session_token=session_token | For My testing. yall can leave this part alone
        )
        
        response = sns_client.subscribe(
            TopicArn=topic_arn,
            Protocol="email",
            Endpoint=email
        )
        logger.info(f"Successfully initiated SNS subscription for {email}")
        return response
    except ClientError as e:
        logger.error(f"Failed to subscribe user {email} to SNS: {e}")
        return None
    except Exception as e:
        logger.error(f"An unexpected error occurred during SNS subscription for {email}: {e}")
        return None
