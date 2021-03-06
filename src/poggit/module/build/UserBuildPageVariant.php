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

namespace poggit\module\build;

use poggit\session\SessionUtils;

class UserBuildPageVariant extends RepoListBuildPageVariant {
    /** @var string */
    private $user;

    public function __construct(string $user) {
        $this->user = $user;
        parent::__construct();
    }

    public function getTitle() : string {
        return "Projects of $this->user";
    }

    public function output() {
        parent::output();
    }

    protected function getRepos() : array {
        $session = SessionUtils::getInstance();
        return $this->getReposByGhApi("users/$this->user/repos?per_page=100", $session->getAccessToken());
    }

    protected function throwNoRepos() {
        throw new AltVariantException(new RecentBuildPageVariant(<<<EOD
<p>This user does not exist or does not have any GitHub repos.</p>
EOD
        ));
    }

    protected function throwNoProjects() {
        throw new AltVariantException(new RecentBuildPageVariant(<<<EOD
<p>This user does not have any GitHub repos with Poggit Build enabled on Poggit.</p>
EOD
        ));
    }
}
