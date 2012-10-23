from os.path import join
from django.contrib import admin
from django.conf.urls.defaults import patterns, include, url
from django.conf.urls.static import static
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.conf import settings
from ella_hub.api import EllaHubApi
from ella_hub.utils.workflow import init_ella_workflow


admin.autodiscover()

# admin API setup
admin_api = EllaHubApi("admin-api")
resources = admin_api.collect_resources()
admin_api.register_resources(resources)
admin_api.register_view_model_permission()
init_ella_workflow(resources)


urlpatterns = patterns('',
    url(r'^admin/', include(admin.site.urls)),
    url(r'^', include(admin_api.urls)),
    url(r'^', include('ella.core.urls')),
)
urlpatterns += staticfiles_urlpatterns()
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static('/admin-hope/', show_indexes=True,
    document_root=join(settings.PROJECT_ROOT, 'static/'))
