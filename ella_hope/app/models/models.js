// steal model files
steal(
	'//can/can.fixture.js'
	, 'can/observe/validations' // validation
)
.then(
	"./article.js"
	, "./author.js"
	, "./draft.js"
	, "./category.js"
	, "./galleryitem.js"
	, "./filmstripframe.js"
	, "./listing.js"
	, "./photo.js"
	, "./photo-format.js"
	, "./source.js"
	, "./tag.js"
	, "./user.js"
	, "./wikipage.js"
)
.then(	// following models inherit from previous models - must be loaded later
	"./gallery.js"
	, "./filmstrip.js"
);
