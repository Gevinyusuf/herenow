import boto3
from botocore.exceptions import ClientError
import os
from dotenv import load_dotenv
import logging

# 加载环境变量
load_dotenv()

logger = logging.getLogger(__name__)

class R2Client:
    def __init__(self, account_id=None, access_key_id=None, secret_access_key=None, bucket_name=None):
        """
        初始化 R2 客户端
        :param account_id: Cloudflare 的 Account ID (可选，默认从环境变量读取)
        :param access_key_id: R2 API Token 的 Access Key ID (可选，默认从环境变量读取)
        :param secret_access_key: R2 API Token 的 Secret Access Key (可选，默认从环境变量读取)
        :param bucket_name: 你在 R2 创建的存储桶名称 (可选，默认从环境变量读取)
        """
        # 从环境变量读取配置，如果参数提供了则优先使用参数
        self.account_id = account_id or os.getenv("R2_ACCOUNT_ID", "").strip()
        self.access_key_id = access_key_id or os.getenv("R2_ACCESS_KEY_ID", "").strip()
        self.secret_access_key = secret_access_key or os.getenv("R2_SECRET_ACCESS_KEY", "").strip()
        self.bucket_name = bucket_name or os.getenv("R2_BUCKET_NAME", "").strip()
        
        # 验证必需的配置
        if not self.account_id:
            raise ValueError("R2_ACCOUNT_ID not found")
        if not self.access_key_id:
            raise ValueError("R2_ACCESS_KEY_ID not found")
        if not self.secret_access_key:
            raise ValueError("R2_SECRET_ACCESS_KEY not found")
        if not self.bucket_name:
            raise ValueError("R2_BUCKET_NAME not found")
        
        # 构造 R2 的 Endpoint URL
        # 注意：格式必须是 https://<account_id>.r2.cloudflarestorage.com
        endpoint_url = f"https://{self.account_id}.r2.cloudflarestorage.com"

        self.s3 = boto3.client(
            service_name='s3',
            endpoint_url=endpoint_url,
            aws_access_key_id=self.access_key_id,
            aws_secret_access_key=self.secret_access_key,
            region_name='auto' # R2 不需要特定的 region，填 auto 即可
        )

    def upload_fileobj(self, file_obj, object_name, content_type=None):
        """
        上传文件对象（用于 FastAPI UploadFile）
        :param file_obj: 文件对象（如 FastAPI 的 UploadFile）
        :param object_name: 上传到云端后的文件名
        :param content_type: 文件 MIME 类型（可选）
        :return: 成功返回 True，失败返回 False
        """
        try:
            extra_args = {}
            if content_type:
                extra_args['ContentType'] = content_type
            
            self.s3.upload_fileobj(
                file_obj,
                self.bucket_name,
                object_name,
                ExtraArgs=extra_args
            )
            return True
        except ClientError as e:
            logger.error(f"Upload failed: {e}")
            return False

    def get_file_url(self, object_name, expires_in=3600):
        """
        获取文件的预签名 URL（用于下载）
        :param object_name: 文件在 R2 中的 key
        :param expires_in: URL 有效期（秒），默认 1 小时
        :return: 预签名 URL
        """
        try:
            url = self.s3.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': object_name},
                ExpiresIn=expires_in
            )
            return url
        except ClientError as e:
            logger.error(f"Generate presigned URL failed: {e}")
            return None

    def download_file(self, object_name, save_path):
        """
        下载文件
        :param object_name: 云端的文件名
        :param save_path: 保存到本地的路径
        """
        try:
            # 确保保存目录存在
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            
            self.s3.download_file(self.bucket_name, object_name, save_path)
            return True
        except ClientError as e:
            return False

    def delete_file(self, object_name):
        """
        删除文件
        :param object_name: 要删除的文件名
        """
        try:
            self.s3.delete_object(Bucket=self.bucket_name, Key=object_name)
            return True
        except ClientError as e:
            return False


    def list_files(self, prefix=''):
        """
        列出桶内文件
        :param prefix: 文件前缀（相当于搜索文件夹）
        """
        try:
            response = self.s3.list_objects_v2(Bucket=self.bucket_name, Prefix=prefix)
            if 'Contents' in response:
                print(f"📂 '{self.bucket_name}' 中的文件:")
                for obj in response['Contents']:
                    print(f" - {obj['Key']} (大小: {obj['Size']} bytes)")
                return response['Contents']
            else:
                return []
        except ClientError as e:
            return []