import api

from django.contrib import admin
from django.conf.urls.defaults import patterns, include, url, handler404, handler500
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.views.generic.simple import direct_to_template

admin.autodiscover()



urlpatterns = patterns('',
    # enable admin
    url(r'^admin/', include(admin.site.urls)),

    (r'^', include(api.urls)),
    (r'^admin-hope/(?P<path>.*)$', 'django.views.static.serve', {
        'document_root': 'admin-hope',
        'show_indexes': True,
    }),

    (r'^', include('ella.core.urls')),
) + staticfiles_urlpatterns()
