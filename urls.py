import os.path

from django.contrib import admin
from django.conf.urls.defaults import patterns, include, url, handler404, handler500
from django.conf.urls.static import static
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.views.generic.simple import direct_to_template
from django.conf import settings

from ella_hub.api import EllaHubApi


admin.autodiscover()

# admin API setup
admin_api = EllaHubApi("admin-api")
resource_modules = admin_api.collect_resources()
admin_api.register_resources(resource_modules)



urlpatterns = patterns('',
    # enable admin
    url(r'^admin/', include(admin.site.urls)),

    url(r'^admin-hope/(?P<path>.*)$', 'django.views.static.serve', {
        'document_root': os.path.join(settings.PROJECT_ROOT, 'ella_hope/admin/'),
        'show_indexes': True,
    }),

    url(r'^', include(admin_api.urls)),
    url(r'^', include('ella.core.urls')),
) + staticfiles_urlpatterns() + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
