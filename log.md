Whenever you encounter an issue in file 'f', log an issue under the ##f header.  I've included some examples of the style I was thinking of below.  If maintaining this becomes a pain, let me know and we can try and come up with a better system.

I would _never_ distribute any of these logs without the permission of every member of the team, but let me know if you feel uncomfortable reporting any issue to this log.  I can also try and come up with a mechanism for making this private if there is a concern of privacy.


#Confusion point:
  How information is loaded between CPU and GPU, and the distincion between GLSL/WebGL/JS
  A very broad point - but very confusing



// SAMPLE ERRORS, put yours above
## phong_fragment.lgl
* [Bug] Forgot to use a 0 instead of a 1 in vec4(fragNom, 1.)
* [Complaint] Typing a full geometric type takes too long
* [Bug] Applied a double negative to a vector, was super hard to find

## main.ts
* [Complaint] Getting the exact string names for binding is super annoying
* [Bug] Forgot to declare a matrix _again_
