/*
 * Copyright 2016 poggit
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

$(document).ready(function() {
    var inputUser = $("#inputUser");
    var inputRepo = $("#inputRepo");
    var inputProject = $("#inputProject");
    var inputBuild = $("#inputBuild");
    var gotoSelf = $("#gotoSelf");
    var gotoUser = $("#gotoUser");
    var gotoRepo = $("#gotoRepo");
    var gotoProject = $("#gotoProject");
    var gotoBuild = $("#gotoBuild");
    var listener = function() {
        var disableUser = !Boolean(inputUser.val().trim());
        var disableRepo = !(Boolean(inputUser.val().trim()) && Boolean(inputRepo.val().trim()));
        var disableProject = !(Boolean(inputUser.val().trim()) && Boolean(inputRepo.val().trim()) && Boolean(inputProject.val().trim()));
        var disableBuild = !(Boolean(inputUser.val().trim()) && Boolean(inputRepo.val().trim()) && Boolean(inputProject.val().trim()) && Boolean(inputBuild.val().trim()));
        if(gotoUser.hasClass("disabled") !== disableUser) gotoUser.toggleClass("disabled");
        if(gotoRepo.hasClass("disabled") !== disableRepo) gotoRepo.toggleClass("disabled");
        if(gotoProject.hasClass("disabled") !== disableProject) gotoProject.toggleClass("disabled");
        if(gotoBuild.hasClass("disabled") !== disableBuild) gotoBuild.toggleClass("disabled");
    };

    inputUser.keydown(function() {
        setTimeout(listener, 50)
    });
    inputUser.change(listener);
    inputUser.keyup(function(event) {
        if(event.keyCode == 13) gotoUser.click();
    });
    inputRepo.keydown(function() {
        setTimeout(listener, 50)
    });
    inputRepo.change(listener);
    inputRepo.keyup(function(event) {
        if(event.keyCode == 13) gotoRepo.click();
    });
    inputProject.keydown(function() {
        setTimeout(listener, 50)
    });
    inputProject.change(listener);
    inputProject.keyup(function(event) {
        if(event.keyCode == 13) gotoProject.click();
    });
    inputBuild.keydown(function() {
        setTimeout(listener, 50)
    });
    inputBuild.change(listener);
    inputBuild.keyup(function(event) {
        if(event.keyCode == 13) gotoBuild.click();
    });

    gotoSelf.click(function() {
        var $this = $(this);
        if($this.hasClass("disabled")) {
            alert("Please fill in the required fields");
        } else {
            window.location = "${path.relativeRoot}build";
        }
    });
    gotoUser.click(function() {
        var $this = $(this);
        if($this.hasClass("disabled")) {
            alert("Please fill in the required fields");
        } else {
            window.location = "${path.relativeRoot}build/" + inputUser.val();
        }
    });
    gotoRepo.click(function() {
        var $this = $(this);
        if($this.hasClass("disabled")) {
            alert("Please fill in the required fields");
        } else {
            window.location = "${path.relativeRoot}build/" + inputUser.val() + "/" + inputRepo.val();
        }
    });
    gotoProject.click(function() {
        var $this = $(this);
        if($this.hasClass("disabled")) {
            alert("Please fill in the required fields");
        } else {
            window.location = "${path.relativeRoot}build/" + inputUser.val() + "/" + inputRepo.val() + "/" +
                inputProject.val();
        }
    });
    gotoBuild.click(function() {
        var $this = $(this);
        if($this.hasClass("disabled")) {
            alert("Please fill in the required fields");
        } else {
            window.location = "${path.relativeRoot}build/" + inputUser.val() + "/" + inputRepo.val() + "/" +
                inputProject.val() + "/" + $("#inputBuildClass").val() + ":" + inputBuild.val();
        }
    });
});

var lastBuildHistory = 0x7FFFFFFF;

function buildToRow(build) {
    var tr = $("<tr></tr>");
    var type = $("<td></td>");
    type.text(build.classString);
    type.appendTo(tr);
    var internalId = $("<td></td>");
    internalId.text("#" + build.internal);
    internalId.appendTo(tr);
    var buildLink = $("<a></a>");
    var classPfx = {
        1: "dev",
        2: "beta",
        3: "rc"
    };
    buildLink.attr("href", "${path.relativeRoot}build/" + projectData.owner + "/" + projectData.name + "/" +
        projectData.project + "/" + classPfx[build.class] + ":" + build.internal);
    internalId.wrapInner(buildLink);
    var branch = $("<td></td>");
    branch.text(build.branch);
    branch.appendTo(tr);
    var sha = $("<td></td>");
    var cause = JSON.parse(build.cause);
    if(cause !== null) {
        if(cause.name == "CommitBuildCause") { // TODO abstraction
            sha.text("Commit: " + cause.sha.substring(0, 7));
            if(isLoggedIn()) {
                ajax("proxy.api.gh", {
                    data: {
                        url: "repos/" + build.repoOwner + "/" + build.repoName + "/commits/" + cause.sha
                    },
                    success: function(data) {
                        var a = $("<a></a>");
                        a.attr("href", data.html_url);
                        a.text(data.commit.message.split("\n")[0]);
                        a.prepend("<br>");
                        a.prepend(cause.sha.substring(0, 7) + " by " + data.commit.author.name + ": ");
                        a.attr("title", data.commit.message);
                        a.appendTo(sha.empty());
                    }
                });
            } else {
                sha.attr("title", "Please login with GitHub to see more details");
            }
        }
    }
    sha.appendTo(tr);
    var date = $("<td></td>");
    date.addClass("time");
    date.attr("data-timestamp", build.creation);
    timeTextFunc.call(date);
    date.appendTo(tr);
    var buildId = $("<td></td>");
    buildId.text("&" + build.buildId.toString(16));
    buildId.appendTo(tr);
    var permLink = $("<a></a>");
    permLink.attr("href", "${path.relativeRoot}babs/" + build.buildId.toString(16));
    buildId.wrapInner(permLink);
    var dlLink = $("<td></td>");
    var a = $("<a>Direct</a>");
    a.attr("href", "${path.relativeRoot}r/" + build.resourceId + "/" + build.projectName + ".phar?cookie");
    dlLink.append("- ");
    a.appendTo(dlLink);
    dlLink.append("<br>- ");
    a = $("<a>Custom name</a>");
    a.attr("href", "#");
    a.click(function() {
        promptDownloadResource(build.resourceId, build.projectName + ".phar")
    });
    a.appendTo(dlLink);
    dlLink.appendTo(tr);
    var lint = $("<td></td>");
    var statuses = JSON.parse(build.status);
    if(statuses === null) statuses = [];
    var statusNames = {
        0: "good",
        1: "neutral",
        2: "lint",
        3: "warn",
        4: "error"
    };
    var lintc = 0;
    for(var i = 0; i < statuses.length; i++) {
        var status = statuses[i];
        lint.append(document.createTextNode(statusNames[status.status].ucfirst() + ": " + status.name));
        lintc++;
    }
    if(lintc == 0) {
        lint.append("<span class='affirmative''>Affirmative</span>");
        lint.css("text-align", "center");
    }
    lint.appendTo(tr);
    var anchor;
    anchor = $("<a></a>");
    anchor.attr("name", "build-internal-" + build.internal);
    if(window.location.hash == "#" + anchor.attr("name")) {
        window.location.href = window.location.hash;
        setTimeout(function() {
            $("html, body").animate({
                scrollTop: $(tr).offset().top
            });
        }, 100);
    }
    anchor.appendTo(tr);
    anchor = $("<a></a>");
    anchor.attr("name", "build-id-" + build.buildId);
    if(window.location.hash == "#" + anchor.attr("name")) {
        window.location.href = window.location.hash;
        console.log("Moved to " + window.location.hash);
    }
    anchor.appendTo(tr);
    return tr;
}

var loadMoreLock = false;
function loadMoreHistory(projectId) {
    if(loadMoreLock) {
        return;
        /* already loading */
    }
    loadMoreLock = true;
    ajax("build.history", {
        data: {
            projectId: projectId,
            start: lastBuildHistory,
            count: 10
        }, success: function(data) {
            loadMoreLock = false;
            var $table = $("#project-build-history");
            var builds = data.builds;
            for(var i = 0; i < builds.length; i++) {
                var build = builds[i];
                lastBuildHistory = Math.min(lastBuildHistory, build.internal);
                buildToRow(build).appendTo($table);
            }
        }
    });
}
