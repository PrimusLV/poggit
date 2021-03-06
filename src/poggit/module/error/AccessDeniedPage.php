<?php

/*
 * Poggit
 *
 * Copyright (C) 2016 Poggit
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

namespace poggit\module\error;

use poggit\module\Module;
use poggit\Poggit;

class AccessDeniedPage extends Module {
    public function getName() : string {
        return "err";
    }

    public function output() {
        http_response_code(401);
        ?>
        <html>
        <head>
            <?php $this->headIncludes() ?>
            <title>401 Access Denied</title>
        </head>
        <body>
        <div id="body">
            <h1>401 Access Denied</h1>
            <p>Path <code class="code"><span class="verbose"><?= htmlspecialchars(Poggit::getRootPath())
                        ?></span><?= $this->getQuery() ?></code>
                cannot be accessed by your current login.</p>
            <p>Referrer: <?= $_SERVER["HTTP_REFERER"] ?? "(none)" ?></p>
        </div>
        </body>
        </html>
        <?php
    }
}
