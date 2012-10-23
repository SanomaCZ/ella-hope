from os.path import join, dirname, abspath
from django.conf.urls.static import static
from django.contrib.staticfiles.urls import staticfiles_urlpatterns


ROOT_PATH = abspath(join(dirname(__file__), 'static'))


urlpatterns = static('admin-hope', document_root=ROOT_PATH, show_indexes=True)
urlpatterns += staticfiles_urlpatterns()
