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
	, "./listing.js"
	, "./photo.js"
	, "./photo-format.js"
	, "./source.js"
	, "./tag.js"
	, "./user.js"
);