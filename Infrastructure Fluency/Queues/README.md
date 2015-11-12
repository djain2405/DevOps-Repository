Cache, Proxies, Queues
=========================

### An expiring cache

- Created two routes, `/get` and `/set`.

- When `/set` is visited, a new key is set, with the value:
> "this message will self-destruct in 10 seconds".

<code>client.expire</code> command  is used to make sure this key expires in 10 seconds.

- When `/get` is visited, the key is fetched and the value is sent back to the cient using <code>res.send(value)</code> 

![Image of screenshot](https://github.ncsu.edu/djain2/HW/blob/master/HW3/Queues/DevOpsHW3Part1.gif)

### Recent visited sites

- Created a new route, `/recent`, which displays the five topmost recently visited sites.

- Used the <code>lpush</code> and the <code>lrange</code> methods of client to achieve this,

![Image of screenshot](https://github.ncsu.edu/djain2/HW/blob/master/HW3/Queues/DevOpsHW3PArt2.gif)

### Picture Uploads and Meow

- Implemented two routes, `/upload`, and `/meow`.
 
- Used curl to upload the images.

	eg. curl -F "image=@./img/morning.jpg" localhost:3000/upload

<code>upload</code> push and curl stores the images in a queue. I used <code>client.push</code> to achieve this.
- The get request <code>meow</code> pops the most recent image from this queue and displays the image in the browser.

![Image of screenshot](https://github.ncsu.edu/djain2/HW/blob/master/HW3/Queues/DevOpsHW3Part4.gif)

### Additional Service Instance Running

- I have two instances of HTTP Server running on two different ports. This allows for multiple hosts listening to the requests and resolving them.

### Proxy server

- Created an http proxy server which uniformly delivers the requests to the two hosts instantiated earlier. The redis client command <code>rpoplpush</code> is used to achieve this with same source and destination. This uses a circular list pattern and constantly removes the hosts from the front and pushes it from the back ensuring alternate service between the two hosts.

![Image of screenshot](https://github.ncsu.edu/djain2/HW/blob/master/HW3/Queues/DevOpsHW3Part5.gif)
