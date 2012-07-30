from django.contrib import admin
from django.conf.urls.defaults import patterns, include, url, handler404, handler500
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.views.generic.simple import direct_to_template

from ella_hub.api import EllaHubApi

admin.autodiscover()

# admin API setup
admin_api = EllaHubApi("admin-api")
resource_modules = admin_api.collect_resources()
admin_api.register_resources(resource_modules)



urlpatterns = patterns('',
    # enable admin
    url(r'^admin/', include(admin.site.urls)),

    (r'^', include(admin_api.urls)),
    #(r'^', include('ella.core.urls')),
) + staticfiles_urlpatterns()
