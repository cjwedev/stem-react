/* eslint no-undef:0 no-unused-vars:0 */
/* global describe, it, before, beforeEach, after, afterEach */
import chai, { expect } from 'chai';
import tt from 'counterpart';

tt.registerTranslations('en', require('app/locales/en.json'))


import HtmlReady from './HtmlReady';


describe('htmlready', () => {
    let phishyText = '';
    before(() => {
        phishyText = tt('g.phishy_text')
    });

    it('should return plain text without html unmolested', () => {
        const teststring = 'teststring lol';
        expect(HtmlReady(teststring).html).to.equal(teststring);
    });

    it('should allow links where the text portion and href contains steemit.com', () => {
        const dirty = '<xml xmlns="http://www.w3.org/1999/xhtml"><a href="https://steemit.com/signup" xmlns="http://www.w3.org/1999/xhtml">https://steemit.com/signup</a></xml>';
        const res = HtmlReady(dirty).html
        expect(res).to.equal(dirty);
    });

    it('should not allow links where the text portion contains steemit.com but the link does not', () => {
        const dirty = '<xml xmlns="http://www.w3.org/1999/xhtml"><a href="https://steamit.com/signup" xmlns="http://www.w3.org/1999/xhtml">https://steemit.com/signup</a></xml>';
        const cleansed = `<xml xmlns="http://www.w3.org/1999/xhtml"><div title="${phishyText}" class="phishy">https://steemit.com/signup / https://steamit.com/signup</div></xml>`;
        const res = HtmlReady(dirty).html
        expect(res).to.equal(cleansed);

        const withuser = '<xml xmlns="http://www.w3.org/1999/xhtml"><a href="https://steamit.com/signup" xmlns="http://www.w3.org/1999/xhtml">https://official@steemit.com/signup</a></xml>';
        const cleansedwithuser = `<xml xmlns="http://www.w3.org/1999/xhtml"><div title="${phishyText}" class="phishy">https://official@steemit.com/signup / https://steamit.com/signup</div></xml>`;
        const reswithuser = HtmlReady(withuser).html
        expect(reswithuser).to.equal(cleansedwithuser);

        const noendingslash = '<xml xmlns="http://www.w3.org/1999/xhtml"><a href="https://steamit.com" xmlns="http://www.w3.org/1999/xhtml">https://steemit.com</a></xml>';
        const cleansednoendingslash = `<xml xmlns="http://www.w3.org/1999/xhtml"><div title="${phishyText}" class="phishy">https://steemit.com / https://steamit.com</div></xml>`;
        const resnoendingslash = HtmlReady(noendingslash).html
        expect(resnoendingslash).to.equal(cleansednoendingslash);
    });
});
