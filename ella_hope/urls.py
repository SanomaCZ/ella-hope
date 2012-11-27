from django.conf.urls.static import static
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.conf import settings


urlpatterns = static('admin-hope', document_root=settings.STATIC_ROOT, show_indexes=True)
urlpatterns += staticfiles_urlpatterns()
