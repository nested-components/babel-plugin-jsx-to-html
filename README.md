# babel-plugin-jsx-to-html

This plugin is forked from [codemix/babel-plugin-hyperhtml](https://github.com/codemix/babel-plugin-hyperhtml), and it's a reduced version of it. While that plugin expects `hyperhtml` as a dependency, this one does not. Also, while that plugin treats JSX inside `Component` superclasses differently, this one treats all JSX's as the same. You can use this plugin with [hyperHTML](https://github.com/WebReflection/hyperHTML), [lighterhtml](https://github.com/WebReflection/lighterhtml), [htm](https://github.com/developit/htm) and others that uses JavaScript tagged templates. 

## Usage

```
npm install --dev babel-plugin-jsx-to-html
```

Then add the following to your babel configuration:

```json
{
  "plugins": [
    ["@babel/plugin-transform-react-jsx"],
    ["hyperhtml", {"pragma": "your_own_template_function"}], // when pragma is unset, or no option is given, pragma is simply "html"
  ]
}
```

## Example

```js
const Greet = ({name, ...extra}) => <div {...extra}><h1>Hi {name}</h1></div>
  
class DemoComponent extends Component {
  render() {
     return (
       <div class="test">
         <Greet name="Alice" class="greeter" />
         <p>This is some text</p>
       </div>
     );
  }
}
```
Transpiles to the following:

```js
const Greet = ({name, ...extra}) => html`<div ${extra}><h1>Hi ${name}</h1></div>`
  
class DemoComponent extends Component {
  render() {
     return html`<div class="test">
         ${new Greet({
           name: "Alice",
           class: "greeter"
         })}
         <p>This is some text</p>
       </div>`;
  }
}
```

## Usage

See the [demo on AST Explorer](https://astexplorer.net/#/gist/bd0aaf31811a4f68e637c330d0472391/27bce72aac5a3c41b5bb7b1b4cfcac0885abc423) for now.
