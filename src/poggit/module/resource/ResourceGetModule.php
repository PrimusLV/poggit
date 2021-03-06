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

namespace poggit\module\resource;

use poggit\exception\GitHubAPIException;
use poggit\output\OutputManager;
use poggit\module\Module;
use poggit\Poggit;
use poggit\resource\ResourceManager;
use poggit\session\SessionUtils;
use const poggit\RESOURCE_DIR;

class ResourceGetModule extends Module {
    public function getName() : string {
        return "r";
    }

    public function output() {
        $query = $this->getQuery();
        $pos = strpos($query, "/");
        $idStr = $pos === false ? $query : substr($query, 0, $pos);
        if(!is_numeric($idStr)) {
            $this->errorNotFound(true);
        }
        $id = (int) $idStr;
        if($id === ResourceManager::NULL_RESOURCE) {
            http_response_code(204);
            die;
        }
        $res = Poggit::queryAndFetch("SELECT type, mimeType,
            unix_timestamp(created) + duration - unix_timestamp(CURRENT_TIMESTAMP(3)) AS remaining,
            accessFilters FROM resources WHERE resourceId = $id");
        if(!isset($res[0])) {
            $this->error(404, "Resource.NotFound", "There is no resource associated with this ID");
        }
        $res = $res[0];
        $type = $res["type"];
        $remaining = (float) $res["remaining"];
        $accessFilters = json_decode($res["accessFilters"]);
        if($remaining < 0) {
            $this->error(410, "Expired", "Resource has expired and is deleted", ["seconds" => -$remaining]);
            die;
        }
        $accessToken = "";
        if(isset($_REQUEST["cookie"])) {
            $accessToken = SessionUtils::getInstance()->getAccessToken();
        }
        if(isset($_REQUEST["access_token"])) {
            $accessToken = $_REQUEST["access_token"];
        }
        $headers = apache_request_headers();
        if(isset($headers["Authorization"])) {
            $auth = $headers["Authorization"];
            $accessToken = ($pos = strpos($auth, " ")) !== false ? substr($auth, $pos + 1) : $auth;
        }
        // blacklists
        foreach($accessFilters as $filter) {
            if($filter->type === "repoAccess") {
                $repo = $filter->repo;
                try {
                    $data = Poggit::ghApiGet("repositories/$repo->id", $accessToken);
                } catch(GitHubAPIException $e) {
                    $this->error(401, "AccessFilter.RepoNotFound",
                        "Access to repo #$repo->id ($repo->owner/$repo->name) required. " .
                        "The repo is deleted or private to the provided access token. " .
                        "Access tokens can be provided using the Authorization header.", ["repo" => $repo]);
                    die;
                }
                foreach($repo->requiredPerms as $perm) {
                    if(!$data->permissions->{$perm}) {
                        $this->error(401, "AccessFilter.PermDenied",
                            "Provided access token does not have $perm access to repo $data->full_name. " .
                            "Access tokens can be provided using the Authorization header.", ["repo" => $repo]);
                        die;
                    }
                }

            }
        }
        $file = RESOURCE_DIR . $id . "." . $type;
        if(!is_file($file)) {
            $this->error(500, "Internal.NotFound",
                "The resource is lost from the server resource storage; please report this issue");
            die;
        }
        OutputManager::terminateAll();
        header("Content-Type: " . $res["mimeType"]);
        readfile($file);
        die;
    }

    private function error(int $httpCode, string $error, string $message, array $extraData = []) {
        OutputManager::terminateAll();
        http_response_code($httpCode);
        echo json_encode(array_merge([
            "error" => $error,
            "message" => $message
        ], $extraData), JSON_UNESCAPED_SLASHES);
        die;
    }
}
