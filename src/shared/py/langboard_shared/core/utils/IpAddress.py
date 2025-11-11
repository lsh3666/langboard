from ipaddress import ip_address, ip_network
from socket import error, inet_aton


def is_valid_ipv4_address_or_range(ip: str):
    try:
        inet_aton(ip)
        return True
    except error:
        pass

    try:
        ip_network(ip, strict=False)
        return True
    except Exception:
        return False


def is_ipv4_in_range(ip: str, ip_range: str) -> bool:
    try:
        return ip_address(ip) in ip_network(ip_range, strict=False)
    except Exception:
        return False


def make_valid_ipv4_range(ip: str) -> str:
    octets = ip.split(".")
    if octets[-1] != "0/24":
        octets[-1] = "0/24"
    return ".".join(octets)
