const fs = require('fs');
let code = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const regex = /              <\/div>\n            <\/div>\n          <\/div>\n          <\/div>\n        \{\/\* STATS STRIP WITH GLOWING ACCENTS \*\/\}/;

const replacement = `              </div>
            </div>
          </div>
        </section>
        {/* STATS STRIP WITH GLOWING ACCENTS */}`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/pages/Home.tsx', code);
console.log('done');
