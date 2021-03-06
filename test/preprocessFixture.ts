import preprocess, { SveltePreprocessorDefinition } from "../src"
import * as assert from 'assert';

describe("preprocess", function () {
    let p: SveltePreprocessorDefinition;
   
    function testMarkup(input: string, expected: string) {
        let res = p.markup({ content: input, file: 'Index.svelte' });
        assert.equal(res.code, expected);
    }

    //wraps input in a page element so we don't have to account for the xmlns attributes
    function testElementMarkup(input: string, expected: string) {
        let content =  `<page xmlns="tns">\n${input}\n</page>`;
        let res = p.markup({ content: content, file: 'Index.svelte' });

        let codeLines = res.code.split('\n');
        codeLines.shift();
        codeLines.pop()

        assert.equal(codeLines.join('\n'), expected);
    }

    beforeEach(function () {
        p = preprocess();
    });

    it('should process empty file', function () {
        testMarkup('', '');
    });

    describe("preprocess adds xmlns attribute", function () {
        it('should add xmlns attribute to single root element', function () {
            testMarkup('<page class="root-page"/>', '<page xmlns="tns" class="root-page"/>');
        });

        it('should add xmlns attribute to single root element with no attributs', function () {
            testMarkup('<page/>', '<page xmlns="tns" />');
            testMarkup('<page></page>', '<page xmlns="tns" ></page>');
        });

        it('should add xmlns attribute and handle whitespace', function() {
            testMarkup('<page\n></page>', '<page xmlns="tns"\n></page>');
            testMarkup('<page\n  class="hi"></page>', '<page xmlns="tns"\n  class="hi"></page>');
        })
    });

    describe("preprocess adds expands bind: attribute", function () {
        it('should not expand bind on svelte components', function() {
            testElementMarkup('<SvelteComponent bind:a={this} />','<SvelteComponent bind:a={this} />')
        });

        it('should not expand bind on svelte tags', function() {
            testElementMarkup('<svelte:component this={SvelteComponent} bind:a={this} />','<svelte:component this={SvelteComponent} bind:a={this} />')
        });

        it('should expand bind on regular tags', function() {
            testElementMarkup('<textInput bind:text={email} />','<textInput text="{email}" on:textChange="{(e) => email = e.value}" />')
        });

        it('should expand bind with complex lvalues', function() {
            testElementMarkup('<textInput bind:text={user.contactDetais[i].email} />','<textInput text="{user.contactDetais[i].email}" on:textChange="{(e) => user.contactDetais[i].email = e.value}" />')
        });

        it('should not expand bind:this on regular tags', function() {
            testElementMarkup('<textInput bind:this={myinput} />','<textInput bind:this={myinput} />')
        });

        it('should try to bind to each scope variables', function() {
            testElementMarkup('{#each collection as item}<textInput bind:text={item} />{/each}','{#each collection as item}<textInput text="{item}" on:textChange="{(e) => item = e.value}" />{/each}')
        });
    });
    
})