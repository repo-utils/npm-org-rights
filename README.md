# npm org rights

Give somebody your npm publishing rights to all repos in a github org.
A love letter to @visionmedia.

## Usage

Requires node v0.11 because it's written in [co](https://github.com/visionmedia/co).
Also not written as a binary because I don't know how to do `node --harmony` in a binary.

```bash
nvm use 0.11

git clone git://github.com/jonathanong/npm-org-rights
cd npm-org-rights
node --harmony . [org] [user]
```

For example, @visionmedia should do:

```bash
node --harmony . component tootallnate
node --harmony . component jongleberry
node --harmony . koajs jongleberry
```

and the list goes on.

## License

The MIT License (MIT)

Copyright (c) 2013 Jonathan Ong me@jongleberry.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.