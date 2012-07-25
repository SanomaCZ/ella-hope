#!/usr/bin/env python
# -*- coding: utf-8 -*-

from collector import ResourceCollector
from xsaccess import CrossDomainAccess

__all__ = (
    'CrossDomainAccess',
    'urls',
)

urls = ResourceCollector().urls
