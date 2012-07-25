#!/usr/bin/env python
# -*- coding: utf-8 -*-

import resources as ella_resources

from inspect import isclass

from django.conf import settings
from django.utils.importlib import import_module
from django.core.exceptions import ImproperlyConfigured

from api.resources import Resource, ModelResource, ApiModelResource
from tastypie.api import Api

__all__ = (
    'ResourceCollector',
)



class ResourceCollector(Api):
    def __init__(self):
        Api.__init__(self, api_name = 'admin-api')

        resource_modules = self.collect_resources()
        resource_modules.append(ella_resources)
        self.register_resources(resource_modules)


    def collect_resources(self):
        resource_modules = []

        # get resources from installed apps first
        for app in settings.INSTALLED_APPS:
            try:
                mod = import_module('%s.api_resources' % app)
                resource_modules.append(mod)
            except ImportError:
                pass

        # get resources from user defined modules
        for module in getattr(settings, 'RESOURCE_MODULES', ()):
            try:
                mod = import_module(module)
                resource_modules.append(mod)
            except ImportError, e:
                raise ImproperlyConfigured(
                    'Error importing resource module %s,'
                    'check RESOURCE_MODULES '
                    'in your settings: "%s"' % (module, e))

        return resource_modules


    def register_resources(self, resource_modules):
        # register resources
        for module in resource_modules:
            for attr in module.__dict__:
                resource = getattr(module, attr)
                if isclass(resource) and issubclass(resource, Resource) \
                        and resource not in (Resource, ModelResource, ApiModelResource):
                    self.register(resource())




