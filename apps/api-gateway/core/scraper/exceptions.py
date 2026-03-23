"""
爬虫模块自定义异常
"""


class ScraperError(Exception):
    """爬虫基础异常类"""
    pass


class InvalidURLError(ScraperError):
    """无效的 URL 错误"""
    pass


class NetworkError(ScraperError):
    """网络请求错误"""
    pass


class ParseError(ScraperError):
    """数据解析错误"""
    pass


class TimeoutError(ScraperError):
    """超时错误"""
    pass
