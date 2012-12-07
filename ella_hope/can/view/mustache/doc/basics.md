@page Basics
@parent can.Mustache 0

## Escaping Values

Mustache will escape values enclosed in a `{{  }}` expression.  For example:
	
	{
		friend: "<strong>Justin</strong>"
	}

	{{friend}}

would return:

	&lt;strong&gt;Justin&lt;/strong&gt;

If you would like Mustache to return the value without 
escaping, use the `{{{  }}}` expression.  For example:

	{{{friend}}}

would return:

	<strong>Justin</strong>

## Paths and Context

When Mustache is resolving a object in a section, the current
context is the value that its iterating. For example:

	{
		friends: [ 'Austin' ]
	}

	{{#friends}}
		{{.}}
	{{/friends}}

The `.` would represent the 'Austin' value in the array.

Internally, Mustache keeps a stack of contexts as the template dives
deeper into nested sections and helpers.  If a key is not found within 
the current context, Mustache will look for the key in the parent context
and so on until it resolves the object or reaches the parent most object.  
For example:

	{
		family: [
			{
				name: 'Austin',
				sisters: [
					{
						name: 'Katherine'
					}
				],
				brothers: [
					{
						name: 'Justin'
					}
				]
			}
		]
	}

	{{#family}
		{{#brothers}}
			{{#sisters}}
				{{name}}
			{{/sisters}}
		{{/brothers}}
	{{/family}}

Since `sisters` isn't in the context of the brothers array,
it jumps up to the family object and resolves sisters there.