require 'sinatra/base'

class Easel < Sinatra::Base

	get "/" do
		
		erb :index
		
	end
	
	run!
	
end