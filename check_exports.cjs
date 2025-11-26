const tiptap = require('@tiptap/react');
console.log('Exports:', Object.keys(tiptap));
try {
    const menus = require('@tiptap/react/menus');
    console.log('Menus Exports:', Object.keys(menus));
} catch (e) {
    console.log('No menus subpath');
}
