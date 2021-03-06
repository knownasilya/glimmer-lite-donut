import Component, { tracked } from '@glimmerx/component';

import { Constructor } from '..';
import { setComponentTemplate } from '..';

import { compileTemplate } from './utils';
import { helper } from '@glimmerx/helper';
import { service } from '@glimmerx/service';
import { on, action } from '@glimmerx/modifier';

const { module, test } = QUnit;

export default function renderTests(moduleName: string, render: (component: Constructor<Component>, options?: any) => Promise<string>) {
  module(`${moduleName} rendering`, () => {
    test('it renders a component', async assert => {
      class MyComponent extends Component {}

      setComponentTemplate(MyComponent, compileTemplate(`<h1>Hello world</h1>`));

      const html = await render(MyComponent);
      assert.strictEqual(html, '<h1>Hello world</h1>', 'the template was rendered');
      assert.ok(true, 'rendered');
    });

    test('a component can render a nested component', async assert => {
      class OtherComponent extends Component {}

      setComponentTemplate(OtherComponent, compileTemplate(`Hello world`));

      class MyComponent extends Component {}
      setComponentTemplate(
        MyComponent,
        compileTemplate(`<h1><OtherComponent /></h1>`, () => ({ OtherComponent }))
      );

      const html = await render(MyComponent);
      assert.strictEqual(html, '<h1>Hello world</h1>', 'the template was rendered');
      assert.ok(true, 'rendered');
    });

    test('a component can render multiple nested components', async assert => {
      class Foo extends Component {}
      setComponentTemplate(Foo, compileTemplate(`Foo`));

      class Bar extends Component {}
      setComponentTemplate(Bar, compileTemplate(`Bar`));

      class OtherComponent extends Component {}
      setComponentTemplate(
        OtherComponent,
        compileTemplate(`Hello world <Foo /><Bar />`, () => ({ Foo, Bar }))
      );

      class MyComponent extends Component {}
      setComponentTemplate(
        MyComponent,
        compileTemplate(`<h1><OtherComponent /></h1>`, () => ({ OtherComponent }))
      );

      const html = await render(MyComponent);

      assert.strictEqual(html, '<h1>Hello world FooBar</h1>', 'the template was rendered');
    });

    test('a component can render with helpers', async assert => {
      const myHelper = helper(([name]: [string], { greeting }: { greeting: string }) => {
        return `helper ${greeting} ${name}`;
      });

      class MyComponent extends Component {}
      setComponentTemplate(
        MyComponent,
        compileTemplate('<h1>{{myHelper "foo" greeting="Hello"}}</h1>', () => ({ myHelper }))
      );

      const html = await render(MyComponent);
      assert.strictEqual(html, '<h1>helper Hello foo</h1>', 'the template was rendered');
    });

    test('a component can render with args', async assert => {
      class MyComponent extends Component {}

      setComponentTemplate(MyComponent, compileTemplate('<h1>{{@say}}</h1>'));

      const renderOptions = {
        args: {
          say: 'Hello Dolly!',
        }
      };

      const html = await render(MyComponent, renderOptions);
      assert.strictEqual(html, '<h1>Hello Dolly!</h1>', 'the component is rendered with passed in args');
    });

    test('a component can inject services', async assert => {
      class LocaleService {
        get currentLocale() {
          return 'en_US';
        }
      }

      class MyComponent extends Component {
        @service locale: LocaleService;
        get myLocale() {
          return this.locale.currentLocale;
        }
      }

      setComponentTemplate(MyComponent, compileTemplate('<h1>{{this.myLocale}}</h1>'));

      const html = await render(MyComponent, {
        services: {
          locale: new LocaleService(),
        },
      });
      assert.strictEqual(html, '<h1>en_US</h1>');
    });

    test('a helper can inject services', async assert => {
      class LocaleService {
        get currentLocale() {
          return 'en_US';
        }
      }

      const myHelper = helper((args, hash, { services }) => {
        const localeService = services!.locale as LocaleService;
        return `The locale is ${localeService.currentLocale}`;
      });

      class MyComponent extends Component {}
      setComponentTemplate(
        MyComponent,
        compileTemplate('<h1>{{myHelper}}</h1>', () => ({ myHelper }))
      );

      const html = await render(MyComponent, {
        services: {
          locale: new LocaleService(),
        },
      });
      assert.strictEqual(html, '<h1>The locale is en_US</h1>');
    });

    test('a component can be rendered more than once', async assert => {
      class MyComponent extends Component { }

      setComponentTemplate(MyComponent, compileTemplate(`<h1>Bump</h1>`));

      let html = await render(MyComponent);
      assert.strictEqual(html, '<h1>Bump</h1>', 'the component rendered');
      assert.ok(true, 'rendered');

      html = await render(MyComponent);
      assert.strictEqual(html, '<h1>Bump</h1>', 'the component was rendered again');
      assert.ok(true, 'rendered');
    });

    test('a component can use modifiers', async assert => {
      class MyComponent extends Component {
        @tracked count = 0;

        @action
        incrementCounter() {
          this.count++;
        }
      }

      setComponentTemplate(
        MyComponent,
        compileTemplate(
          `<button {{on "click" this.incrementCounter}}>Count: {{this.count}}</button>`,
          () => ({on})
        )
      );

      let html = await render(MyComponent);
      assert.strictEqual(html, `<button>Count: 0</button>`, 'the component was rendered');
    });
  });
}
