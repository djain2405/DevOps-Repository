# Learn Git branching levels passed

**Level intro1**

	git commit
	git commit
	
**Level intro2**

	git branch bugFix
	git checkout bugFix

**Level intro3**

	git branch bugFix
	git checkout bugFix
	git commit
	git checkout master
	git commit
	git merge bugFix
	
**Level intro4**

	git branch bugFix
	git checkout bugFix
	git commit
	git checkout master
	git commit
	git checkout bugFix
	git rebase master
	
**level rampup1**

	git checkout C3

**level rampup2**

	git checkout C4^
	
**level rampup3**
	
	git checkout C6
	git branch -f master HEAD
	git checkout HEAD~3
	git branch -f bugFix HEAD~1
	
**level rampup4**

	git reset HEAD~1
	git checkout pushed
	git revert C2
	
**Screenshot of levels achieved**

![Image of screenshot](https://github.ncsu.edu/djain2/HW/blob/master/screenshot.png)

#**Hooks**

Contents of the post-commit file:

Path : .git/hooks/post-commit

	#!/bin/sh

	start "http:www.google.com"
	
#Link to .gif 

https://drive.google.com/file/d/0B56tPT2szLgYSUFYNlNETnFZSlU/view?usp=sharing
